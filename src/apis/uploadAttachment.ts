import FormData from "form-data";
import fs from "node:fs";
import type { UploadCallback } from "../context.js";
import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { ThreadType, type AttachmentSource } from "../models/index.js";
import {
    apiFactory,
    getFileExtension,
    getFileName,
    getFileSize,
    getImageMetaData,
    getMd5LargeFileObject,
    resolveResponse,
} from "../utils.js";

export type UploadAttachmentImageResponse = {
    normalUrl: string;
    photoId: string;
    finished: number | boolean;
    hdUrl: string;
    thumbUrl: string;
    clientFileId: number;
    chunkId: number;

    fileType: "image";
    width: number;
    height: number;
    totalSize: number;
    hdSize: number;
};

export type UploadAttachmentVideoResponse = {
    finished: number | boolean;
    clientFileId: number;
    chunkId: number;

    fileType: "video";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};

export type UploadAttachmentFileResponse = {
    finished: number | boolean;
    clientFileId: number;
    chunkId: number;

    fileType: "others";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};

export type ImageData = {
    fileName: string;
    totalSize: number | undefined;
    width: number | undefined;
    height: number | undefined;
};

export type FileData = {
    fileName: string;
    totalSize: number;
};

export type UploadAttachmentType = UploadAttachmentImageResponse | UploadAttachmentVideoResponse | UploadAttachmentFileResponse;
export type UploadAttachmentResponse = UploadAttachmentType[];

type RawResponse = {
    finished: number | boolean;
    clientFileId: number;
    chunkId: number;

    fileId?: string;
    photoId?: string;

    normalUrl?: string;
    hdUrl?: string;
    thumbUrl?: string;
};

type AttachmentData =
    | {
          filePath: string;
          fileType: "image";
          chunkContent: FormData[];
          fileData: ImageData;
          params: {
              toid?: string;
              grid?: string;
              totalChunk: number;
              fileName: string;
              clientId: number;
              totalSize: number;
              imei: string;
              isE2EE: number;
              jxl: number;
              chunkId: number;
          };
          source: AttachmentSource;
      }
    | {
          filePath: string;
          fileType: "video" | "others";
          chunkContent: FormData[];
          fileData: FileData;
          params: {
              toid?: string;
              grid?: string;
              totalChunk: number;
              fileName: string;
              clientId: number;
              totalSize: number;
              imei: string;
              isE2EE: number;
              jxl: number;
              chunkId: number;
          };
          source: AttachmentSource;
      };

const urlType = {
    image: "photo_original/upload",
    video: "asyncfile/upload",
    others: "asyncfile/upload",
};

export const uploadAttachmentFactory = apiFactory()((api, ctx, utils) => {
    const serviceURL = `${api.zpwServiceMap.file[0]}/api`;
    const { sharefile } = ctx.settings!.features;

    function isExceedMaxFile(totalFile: number) {
        return totalFile > sharefile.max_file;
    }

    function isExceedMaxFileSize(fileSize: number) {
        return fileSize > sharefile.max_size_share_file_v3 * 1024 * 1024;
    }

    function isExtensionValid(ext: string) {
        return sharefile.restricted_ext_file.indexOf(ext) == -1;
    }

    /**
     * Upload an attachment to a thread
     *
     * @param sources path to files or attachment sources
     * @param threadId Group or User ID
     * @param type Message type (User or Group)
     *
     * @throws {ZaloApiError | ZaloApiMissingImageMetadataGetter}
     */
    return async function uploadAttachment(
        sources: AttachmentSource | AttachmentSource[],
        threadId: string,
        type: ThreadType = ThreadType.User,
    ): Promise<UploadAttachmentType[]> {
        if (!sources) throw new ZaloApiError("Missing sources");
        if (!Array.isArray(sources)) sources = [sources];
        if (sources.length == 0) throw new ZaloApiError("Missing sources");
        if (isExceedMaxFile(sources.length)) throw new ZaloApiError("Exceed maximum file of " + sharefile.max_file);
        if (!threadId) throw new ZaloApiError("Missing threadId");

        const chunkSize = ctx.settings!.features.sharefile.chunk_size_file;
        const isGroupMessage = type == ThreadType.Group;
        const attachmentsData: AttachmentData[] = [];
        const url = `${serviceURL}/${isGroupMessage ? "group" : "message"}/`;
        const typeParam = isGroupMessage ? "11" : "2";

        let clientId = Date.now();
        for (const source of sources) {
            const isFilePath = typeof source == "string";
            const isBuffer = typeof source == "object" && source.data instanceof Buffer;

            if (!isFilePath && !isBuffer) throw new ZaloApiError("Invalid source type");
            if (!isFilePath && !source.filename) throw new ZaloApiError("Missing filename");

            if (isFilePath && !fs.existsSync(source)) throw new ZaloApiError("File not found");

            const extFile = getFileExtension(isFilePath ? source : source.filename).toLowerCase();
            const fileName = isFilePath ? getFileName(source) : source.filename;

            if (isExtensionValid(extFile) == false)
                throw new ZaloApiError(`File extension "${extFile}" is not allowed`);

            const data: AttachmentData = {
                filePath: isFilePath ? source : source.filename,
                chunkContent: [] as FormData[],
                params: {},
                source,
            } as AttachmentData;

            if (isGroupMessage) data.params.grid = threadId;
            else data.params.toid = threadId;

            switch (extFile) {
                case "jpg":
                case "jpeg":
                case "png":
                case "webp": {
                    const imageData = isFilePath ? await getImageMetaData(ctx, source) : { ...source.metadata, fileName };
                    if (isExceedMaxFileSize(imageData.totalSize!))
                        throw new ZaloApiError(
                            `File ${fileName} size exceed maximum size of ${sharefile.max_size_share_file_v3}MB`,
                        );

                    data.fileData = imageData;
                    data.fileType = "image";

                    data.params.totalChunk = Math.ceil(data.fileData.totalSize! / chunkSize);
                    data.params.fileName = fileName;
                    data.params.clientId = clientId++;
                    data.params.totalSize = imageData.totalSize!;
                    data.params.imei = ctx.imei;
                    data.params.isE2EE = 0;
                    data.params.jxl = 0;
                    data.params.chunkId = 1;

                    break;
                }
                case "mp4": {
                    const videoSize = isFilePath ? await getFileSize(source) : source.metadata.totalSize;
                    if (isExceedMaxFileSize(videoSize))
                        throw new ZaloApiError(
                            `File ${fileName} size exceed maximum size of ${sharefile.max_size_share_file_v3}MB`,
                        );

                    data.fileType = "video";
                    data.fileData = {
                        fileName,
                        totalSize: videoSize,
                    };

                    data.params.totalChunk = Math.ceil(data.fileData.totalSize! / chunkSize);
                    data.params.fileName = fileName;
                    data.params.clientId = clientId++;
                    data.params.totalSize = videoSize;
                    data.params.imei = ctx.imei;
                    data.params.isE2EE = 0;
                    data.params.jxl = 0;
                    data.params.chunkId = 1;

                    break;
                }
                default: {
                    const fileSize = isFilePath ? await getFileSize(source) : source.metadata.totalSize;
                    if (isExceedMaxFileSize(fileSize))
                        throw new ZaloApiError(
                            `File ${fileName} size exceed maximum size of ${sharefile.max_size_share_file_v3}MB`,
                        );

                    data.fileType = "others";
                    data.fileData = {
                        fileName,
                        totalSize: fileSize,
                    };

                    data.params.totalChunk = Math.ceil(data.fileData.totalSize! / chunkSize);
                    data.params.fileName = fileName;
                    data.params.clientId = clientId++;
                    data.params.totalSize = fileSize;
                    data.params.imei = ctx.imei;
                    data.params.isE2EE = 0;
                    data.params.jxl = 0;
                    data.params.chunkId = 1;

                    break;
                }
            }

            const fileBuffer = isFilePath ? await fs.promises.readFile(source) : source.data;
            for (let i = 0; i < data.params.totalChunk; i++) {
                const formData = new FormData();
                const slicedBuffer = fileBuffer.subarray(i * chunkSize, (i + 1) * chunkSize);
                formData.append("chunkContent", slicedBuffer, {
                    filename: fileName,
                    contentType: "application/octet-stream",
                });

                data.chunkContent[i] = formData;
            }
            attachmentsData.push(data);
        }

        const requests = [],
            results: UploadAttachmentType[] = [];

        for (const data of attachmentsData) {
            for (let i = 0; i < data.params.totalChunk; i++) {
                const encryptedParams = utils.encodeAES(JSON.stringify(data.params));
                if (!encryptedParams) throw new ZaloApiError("Failed to encrypt message");

                requests.push(
                    utils
                        .request(
                            utils.makeURL(url + urlType[data.fileType], { type: typeParam, params: encryptedParams }),
                            {
                                method: "POST",
                                headers: data.chunkContent[i].getHeaders(),
                                body: data.chunkContent[i].getBuffer(),
                            },
                        )
                        .then(async (response) => {
                            /**
                             * @TODO: better type rather than any
                             */
                            const resData = await resolveResponse<RawResponse>(ctx, response);

                            if (resData && resData.fileId != "-1" && resData.photoId != "-1")
                                await new Promise<void>((resolve) => {
                                    if (data.fileType == "video" || data.fileType == "others") {
                                        const uploadCallback: UploadCallback = async (wsData) => {
                                            const result = {
                                                fileType: data.fileType,
                                                ...resData,
                                                ...wsData,
                                                totalSize: data.fileData.totalSize,
                                                fileName: data.fileData.fileName,
                                                checksum: (
                                                    await getMd5LargeFileObject(data.source, data.fileData.totalSize)
                                                ).data,
                                            };
                                            results.push(result);
                                            resolve();
                                        };

                                        ctx.uploadCallbacks.set(resData.fileId!.toString(), uploadCallback);
                                    }

                                    if (data.fileType == "image") {
                                        const result = {
                                            fileType: "image" as const,
                                            width: data.fileData.width!,
                                            height: data.fileData.height!,
                                            totalSize: data.fileData.totalSize!,
                                            hdSize: data.fileData.totalSize!,

                                            finished: resData.finished,
                                            normalUrl: resData.normalUrl!,
                                            hdUrl: resData.hdUrl!,
                                            thumbUrl: resData.thumbUrl!,
                                            chunkId: resData.chunkId,

                                            photoId: resData.photoId!,
                                            clientFileId: resData.clientFileId,
                                        };
                                        results.push(result);
                                        resolve();
                                    }
                                });
                        }),
                );
                data.params.chunkId++;
            }
        }

        await Promise.all(requests);

        return results;
    };
});
