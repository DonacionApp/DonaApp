import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import {
    RekognitionClient,
    DetectLabelsCommand,
    DetectLabelsCommandInput,
    RekognitionClientConfig
} from '@aws-sdk/client-rekognition';

@Injectable()
export class RespaldoiaService {


    private readonly logger = new Logger(RespaldoiaService.name);
    private client: RekognitionClient;

    private readonly awsRegionKey = 'AWS_REGION';
    private readonly awsAccessKeyIdKey = 'AWS_ACCESS_KEY_ID';
    private readonly awsSecretAccessKeyKey = 'AWS_SECRET_ACCESS_KEY';

    constructor(
        private configService: ConfigService
    ) {
        const awsRegion = this.configService.get<string>(this.awsRegionKey);
        const awsAccessKeyId = this.configService.get<string>(this.awsAccessKeyIdKey);
        const awsSecretAccessKey = this.configService.get<string>(this.awsSecretAccessKeyKey);

        if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
            this.logger.error('Las credenciales de AWS no están definidas. Revisa AWS_REGION, AWS_ACCESS_KEY_ID, y AWS_SECRET_ACCESS_KEY.');
            throw new InternalServerErrorException('Configuración de IA incorrecta: Credenciales de AWS faltantes.');
        }

        const clientConfig: RekognitionClientConfig = {
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKeyId,
                secretAccessKey: awsSecretAccessKey,
            },
        };
        this.client = new RekognitionClient(clientConfig);
    }

    async getTagsFromImages(files: Express.Multer.File | Express.Multer.File[]): Promise<string[]> {
        const filesToProcess: Express.Multer.File[] = Array.isArray(files) ? files : (files ? [files] : []);

        if (filesToProcess.length === 0) {
            this.logger.warn('Se llamó al servicio sin archivos para procesar. Devolviendo vacío.');
            return [];
        }

        let tagsCollection: string[] = [];
        const maxLabels = 5;
        const minConfidence = 70; 

        for (const file of filesToProcess) {
            try {
                const input: DetectLabelsCommandInput = {
                    Image: {
                        Bytes: file.buffer,
                    },
                    MaxLabels: maxLabels,
                    MinConfidence: minConfidence,
                };

                const command = new DetectLabelsCommand(input);
                const result = await this.client.send(command);

                if (!result.Labels || result.Labels.length === 0) {
                    this.logger.warn(`Rekognition no devolvió etiquetas para la imagen ${file.originalname}.`);
                    continue;
                }

                const tags: string[] = result.Labels
                    .map(label => label.Name)
                    .filter((n): n is string => typeof n === 'string')
                    .slice(0, 5); 
                tagsCollection.push(...tags);

            } catch (error) {
                
                this.logger.error(`Error analizando imagen con AWS Rekognition (${file.originalname}):`, error);

                continue; 
            }
        }

        return tagsCollection;
    }

}
