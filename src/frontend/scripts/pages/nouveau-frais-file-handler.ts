/**
 * Gestion des uploads de fichiers pour les justificatifs
 * Compression automatique des images > 5MB
 */
export class FileUploadHandler {
  private uploadedFiles: Map<string, File> = new Map();
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  /**
   * Configure le drag & drop et file upload pour un type de frais
   */
  public setupFileUpload(
    type: "repas" | "hebergement",
    onProgress?: () => void
  ): void {
    const dropzone = document.getElementById(`dropzone-${type}`);
    const fileInput = document.getElementById(
      `justificatif-${type}`
    ) as HTMLInputElement;
    const fileName = document.getElementById(`file-name-${type}`);

    if (!dropzone || !fileInput || !fileName) return;

    // Click to browse
    dropzone.addEventListener("click", () => fileInput.click());

    // File selected
    fileInput.addEventListener("change", async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0], type, fileName);
        onProgress?.();
      }
    });

    // Drag and drop
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("border-primary");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("border-primary");
    });

    dropzone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-primary");

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await this.handleFileUpload(files[0], type, fileName);
        onProgress?.();
      }
    });
  }

  /**
   * Récupère un fichier uploadé
   */
  public getFile(type: string): File | undefined {
    return this.uploadedFiles.get(type);
  }

  /**
   * Vérifie si un fichier a été uploadé
   */
  public hasFile(type: string): boolean {
    return this.uploadedFiles.has(type);
  }

  /**
   * Gère l'upload d'un fichier avec validation et compression
   */
  private async handleFileUpload(
    file: File,
    type: string,
    displayElement: HTMLElement
  ): Promise<void> {
    try {
      // Vérifier que c'est une image
      if (!file.type.startsWith("image/")) {
        alert("Seules les images sont acceptées (jpg, png, etc.)");
        return;
      }

      // Si le fichier est déjà <= 5MB, pas besoin de compression
      if (file.size <= this.MAX_SIZE) {
        this.uploadedFiles.set(type, file);
        displayElement.textContent = `✓ ${file.name} (${this.formatFileSize(file.size)})`;
        return;
      }

      // Compresser l'image
      displayElement.textContent = `Compression en cours...`;
      const compressedFile = await this.compressImage(file, this.MAX_SIZE);

      this.uploadedFiles.set(type, compressedFile);
      displayElement.textContent = `✓ ${compressedFile.name} (${this.formatFileSize(compressedFile.size)} - compressé)`;
    } catch (error) {
      console.error("Erreur upload fichier:", error);
      alert("Erreur lors du traitement de l'image");
    }
  }

  /**
   * Compresse une image pour qu'elle fasse moins de maxSize
   */
  private async compressImage(file: File, maxSize: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Calculer les dimensions en gardant le ratio
          let width = img.width;
          let height = img.height;
          const maxDim = 1920; // Limite de dimension max

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compresser progressivement jusqu'à être sous maxSize
          let quality = 0.9;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Compression failed"));
                  return;
                }

                if (blob.size <= maxSize || quality <= 0.1) {
                  // Créer un nouveau File depuis le Blob
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
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

        img.onerror = () => reject(new Error("Erreur chargement image"));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error("Erreur lecture fichier"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formate la taille d'un fichier en KB/MB
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}
