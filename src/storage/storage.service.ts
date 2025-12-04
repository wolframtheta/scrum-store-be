import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class StorageService {
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'images');
    const port = this.configService.get('app.port');
    this.baseUrl = `http://localhost:${port}/images`;
    
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadPath)) {
      await mkdir(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const folderPath = path.join(this.uploadPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(folderPath, filename);

    // Write file to disk
    await writeFile(filePath, file.buffer);

    // Return public URL
    return `${this.baseUrl}/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const urlPath = fileUrl.replace(this.baseUrl, '');
      const filePath = path.join(this.uploadPath, urlPath);

      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
    }
  }

  getFilePath(fileUrl: string): string {
    const urlPath = fileUrl.replace(this.baseUrl, '');
    return path.join(this.uploadPath, urlPath);
  }
}

