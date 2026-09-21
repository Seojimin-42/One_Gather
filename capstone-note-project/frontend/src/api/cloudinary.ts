type UploadTarget = "cover" | "content";

type CloudinaryUploadResult = {
  imageUrl: string;
  publicId: string;
};

const compressImage = (file: File, maxSizeMB = 8): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // 최대 해상도 2400px로 제한
      const MAX_PX = 2400;
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        } else {
          width = Math.round((width * MAX_PX) / height);
          height = MAX_PX;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // quality를 낮춰가며 목표 크기 이하로 압축
      const maxBytes = maxSizeMB * 1024 * 1024;
      let quality = 0.85;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            if (blob.size <= maxBytes || quality <= 0.2) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // 실패 시 원본 그대로
    };

    img.src = objectUrl;
  });
};

export const uploadImageToCloudinary = async (
  file: File,
  target: UploadTarget
): Promise<CloudinaryUploadResult> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const uploadPreset =
    target === "cover"
      ? import.meta.env.VITE_CLOUDINARY_COVER_UPLOAD_PRESET
      : import.meta.env.VITE_CLOUDINARY_CONTENT_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary 환경변수가 설정되지 않았습니다.");
  }

  // 10MB 초과 시 압축
  const MAX_MB = 10;
  const fileToUpload =
    file.size > MAX_MB * 1024 * 1024 ? await compressImage(file) : file;

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message ?? "Cloudinary 이미지 업로드에 실패했습니다.");
  }

  const data = await response.json();

  return {
    imageUrl: data.secure_url,
    publicId: data.public_id,
  };
};