import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";
export const addQuickMessageFactory = apiFactory()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.quick_message[0]}/api/quickmessage/create`);
    /**
     * Add quick message
     *
     * @param addPayload - The payload containing data to add the quick message
     *
     * @note Zalo might throw an error with code 821 if you have reached the limit of quick messages.
     *
     * @throws ZaloApiError
     */
    return async function addQuickMessage(addPayload) {
        const params = {
            keyword: addPayload.keyword,
            message: {
                title: addPayload.title,
                params: "",
            },
            type: 0,
            imei: ctx.imei,
        };
        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams)
            throw new ZaloApiError("Failed to encrypt params");
        const response = await utils.request(utils.makeURL(serviceURL, { params: encryptedParams }), {
            method: "GET",
        });
        return utils.resolve(response);
    };
});
