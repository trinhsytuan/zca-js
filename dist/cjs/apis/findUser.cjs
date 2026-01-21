'use strict';

var ZaloApiError = require('../Errors/ZaloApiError.cjs');
var utils = require('../utils.cjs');

const findUserFactory = utils.apiFactory()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.friend[0]}/api/friend/profile/get`);
    /**
     * Find user by phone number
     *
     * @param phoneNumber Phone number
     * @param isAvatarSizeMax Is avatar size max (default: true)
     *
     * @throws {ZaloApiError}
     */
    return async function findUser(phoneNumber, isAvatarSizeMax = true) {
        if (!phoneNumber)
            throw new ZaloApiError.ZaloApiError("Missing phoneNumber");
        if (phoneNumber.startsWith("0")) {
            if (ctx.language == "vi")
                phoneNumber = "84" + phoneNumber.slice(1);
        }
        const params = {
            phone: phoneNumber,
            avatar_size: isAvatarSizeMax ? 240 : 120,
            language: ctx.language,
            imei: ctx.imei,
            reqSrc: 40,
        };
        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams)
            throw new ZaloApiError.ZaloApiError("Failed to encrypt message");
        const finalServiceUrl = new URL(serviceURL);
        finalServiceUrl.searchParams.append("params", encryptedParams);
        const response = await utils.request(utils.makeURL(finalServiceUrl.toString(), {
            params: encryptedParams,
        }));
        return utils.resolve(response, (result) => {
            if (result.error && result.error.code != 216)
                throw new ZaloApiError.ZaloApiError(result.error.message, result.error.code);
            return result.data;
        });
    };
});

exports.findUserFactory = findUserFactory;
