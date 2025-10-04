import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

import type { AttachmentSource, ProductCatalogItem } from "../models/index.js";

export type UpdateProductCatalogPayload = {
    catalogId: string;

    productId: string;
    productName: string;
    price: string;
    description: string;
    createTime: number;

    /**
     * Upto 5 media files are allowed, will be ignored if product_photos is provided
     */
    files?: AttachmentSource[];
    /**
     * List of product photo URLs, upto 5
     *
     * You can manually get the URL using `uploadProductPhoto` api
     */
    product_photos?: string[];
};

export type UpdateProductCatalogResponse = {
    item: ProductCatalogItem;
    version_ls_catalog: number;
    version_catalog: number;
};

export const updateProductCatalogFactory = apiFactory<UpdateProductCatalogResponse>()((api, _, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.catalog[0]}/api/prodcatalog/product/update`);

    /**
     * Update product catalog?
     *
     * @param payload payload
     *
     * @note this API is used for zBusiness - Maximum 5 media files are supported
     * @throws {ZaloApiError}
     */
    return async function updateProductCatalog(payload: UpdateProductCatalogPayload) {
        const productPhoto = payload.product_photos || [];

        if (payload.files && payload.files.length == 0) {
            if (payload.files.length > 5) {
                throw new ZaloApiError("Maximum 5 media files are allowed");
            }

            for (const mediaFile of payload.files) {
                const uploadMedia = await api.uploadProductPhoto({
                    file: mediaFile,
                });

                const url = uploadMedia.normalUrl || uploadMedia.hdUrl;
                productPhoto.push(url);
            }
        }

        if (productPhoto.length > 5) {
            throw new ZaloApiError("Maximum 5 media files are allowed");
        }

        const params = {
            product_id: payload.productId,
            product_name: payload.productName,
            price: payload.price,
            description: payload.description,
            product_photos: productPhoto,
            catalog_id: payload.catalogId,
            currency_unit: "₫",
            create_time: payload.createTime,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt params");

        const response = await utils.request(serviceURL, {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });

        return utils.resolve(response);
    };
});
