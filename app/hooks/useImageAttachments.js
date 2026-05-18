"use client";
import { useState, useRef, useCallback } from "react";
import { uploadChatImages } from "../lib/api/agent";

const MAX_IMAGES = 3;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

let nextId = 1;

/**
 * Hook for managing image attachments on a chat composer.
 *
 * Each attachment: { id, file, previewUrl, status: "pending" | "uploading" | "uploaded" | "error" }
 */
export default function useImageAttachments() {
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    const errors = [];

    setAttachments((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) {
        errors.push(`Maximum of ${MAX_IMAGES} images allowed.`);
        return prev;
      }

      const accepted = [];
      for (const file of files) {
        if (accepted.length >= remaining) {
          errors.push(`Maximum of ${MAX_IMAGES} images allowed.`);
          break;
        }
        if (!ALLOWED_TYPES.has(file.type)) {
          errors.push(`${file.name}: unsupported type. Use JPEG, PNG, WebP, or GIF.`);
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          errors.push(`${file.name}: exceeds 5MB limit.`);
          continue;
        }
        accepted.push({
          id: nextId++,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "pending",
        });
      }

      return [...prev, ...accepted];
    });

    // Reset the file input so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";

    return errors;
  }, []);

  const removeAttachment = useCallback((id) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const uploadAll = useCallback(async (agencyId, threadId) => {
    setAttachments((prev) =>
      prev.map((a) => (a.status === "pending" ? { ...a, status: "uploading" } : a))
    );

    try {
      const pendingFiles = attachments.filter((a) => a.status === "pending").map((a) => a.file);
      if (pendingFiles.length === 0) return [];

      const result = await uploadChatImages(agencyId, threadId, pendingFiles);
      const urls = (result.images || []).map((img) => img.url);

      setAttachments((prev) =>
        prev.map((a) => (a.status === "uploading" ? { ...a, status: "uploaded" } : a))
      );

      return urls;
    } catch (error) {
      setAttachments((prev) =>
        prev.map((a) => (a.status === "uploading" ? { ...a, status: "error" } : a))
      );
      throw error;
    }
  }, [attachments]);

  const clear = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      return [];
    });
  }, []);

  const hasAttachments = attachments.length > 0;

  return {
    attachments,
    fileInputRef,
    addFiles,
    removeAttachment,
    uploadAll,
    clear,
    hasAttachments,
    MAX_IMAGES,
  };
}
