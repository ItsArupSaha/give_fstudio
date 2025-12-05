/**
 * Firebase Storage Service
 * 
 * Handles file uploads to Firebase Cloud Storage
 */

import { storage } from "@/lib/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from "firebase/storage";

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param file - The file to upload
 * @param path - Storage path (e.g., "submissions/{taskId}/{studentId}/{filename}")
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise with download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // Create resumable upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves when upload completes
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
}

/**
 * Upload multiple files to Firebase Storage
 * @param files - Array of files to upload
 * @param basePath - Base storage path (e.g., "submissions/{taskId}/{studentId}")
 * @param onProgress - Optional progress callback for each file
 * @returns Promise with array of download URLs
 */
export async function uploadFiles(
  files: File[],
  basePath: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      // Create unique filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${basePath}/${timestamp}_${sanitizedFileName}`;
      
      if (onProgress) {
        onProgress(index, 0);
      }
      
      const url = await uploadFile(file, filePath, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      });
      
      if (onProgress) {
        onProgress(index, 100);
      }
      
      return url;
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    throw new Error(`Failed to upload files: ${error}`);
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path of the file to delete
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`);
  }
}

/**
 * Delete multiple files from Firebase Storage
 * @param paths - Array of storage paths to delete
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  try {
    await Promise.all(paths.map((path) => deleteFile(path)));
  } catch (error) {
    throw new Error(`Failed to delete files: ${error}`);
  }
}
