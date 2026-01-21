import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'images');
    const port = this.configService.get('app.port');
    const baseHost = process.env.BASE_URL || `http://localhost:${port}`;
    this.baseUrl = `${baseHost}/images`;
    
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

  async downloadAndSaveImage(imageUrl: string, folder: string, filename: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxRedirects: 5,
      });
      let fileExtension = '.jpg';
      const contentType = response.headers['content-type'];
      if (contentType) {
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          fileExtension = '.jpg';
        } else if (contentType.includes('png')) {
          fileExtension = '.png';
        } else if (contentType.includes('webp')) {
          fileExtension = '.webp';
        } else if (contentType.includes('gif')) {
          fileExtension = '.gif';
        }
      } else {
        const urlPath = new URL(imageUrl).pathname;
        const urlExt = path.extname(urlPath).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExt)) {
          fileExtension = urlExt;
        }
      }
      const maxSize = 5 * 1024 * 1024;
      if (response.data.length > maxSize) {
        throw new BadRequestException('Downloaded image is too large (max 5MB)');
      }
      const folderPath = path.join(this.uploadPath, folder);
      if (!fs.existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true });
      }
      const fullFilename = `${filename}${fileExtension}`;
      const filePath = path.join(folderPath, fullFilename);
      await writeFile(filePath, Buffer.from(response.data));
      return `${this.baseUrl}/${folder}/${fullFilename}`;
    } catch (error) {
      this.logger.error(`Error downloading image from ${imageUrl}:`, error);
      throw new BadRequestException(`Failed to download image: ${error.message}`);
    }
  }
}

