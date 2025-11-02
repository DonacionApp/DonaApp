import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';

@Injectable()
export class IaService {
    private readonly logger = new Logger(IaService.name);
    private genAi: GoogleGenerativeAI;
    private readonly modelName = 'gemini-2.5-flash';

    constructor(
        private configService: ConfigService
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error(' la clave de gemini no esta definida ');
            throw new InternalServerErrorException('Configuracion de IA incorrecta');
        }
        this.genAi = new GoogleGenerativeAI(apiKey);
    }

    async getTagsFromImages(files: Express.Multer.File | Express.Multer.File[]): Promise<string[]> {
        try {
            const filesToProcess: Express.Multer.File[] = Array.isArray(files) ? files : (files ? [files] : []);

            if (filesToProcess.length === 0) {
                this.logger.warn('Se llamó al servicio sin archivos para procesar. Devolviendo vacío.');
                return [];
            }

            const model = this.genAi.getGenerativeModel({ model: this.modelName });
            const promt = `
                 Analiza la siguiente imagen y responde con 5 etiquetas (palabras clave) que describan lo que se ve.
                 Devuelve solo un arreglo JSON de 5 strings, sin texto adicional.
               `;

            let tagsCollection: string[] = [];

            for (const file of filesToProcess) {
                const imageBase64 = file.buffer.toString('base64');
                const result = await model.generateContent([
                    { inlineData: { mimeType: file.mimetype, data: imageBase64 } },
                    { text: promt }
                ]);

                if (!result.response?.text) {
                    this.logger.error(`No se obtuvo respuesta de Gemini para la imagen ${file.originalname}`);
                    continue;
                }

                let text = result.response.text();

                this.logger.log(`Respuesta Gemini (Cruda) para ${file.originalname}: ${text}`)
                text = text.replace(/```json|```/g, '').trim();

                let tags: string[] = [];
                try {
                    tags = JSON.parse(text) as string[];
                } catch (error) {
                    this.logger.warn(`Fallo al parsear JSON: ${error.message}. Aplicando fallback de limpieza de strings.`);

                    tags = text
                        .replace(/[\[\]\n\r"]/g, "")
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 5);
                }
                tagsCollection.push(...tags);
            }

            return tagsCollection;
        } catch (error) {
            this.logger.error("Error analizando imágenes con Gemini:", error);
            throw new InternalServerErrorException(
                'Error al procesar una o más imágenes con la API de Gemini.',
                error
            );
        }
    }
}
