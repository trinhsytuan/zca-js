import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";
export const reviewPendingMemberRequestFactory = apiFactory()((api, _, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.group[0]}/api/group/pending-mems/review`);
    /**
     * Review pending member(s) request
     *
     * @param payload - The payload containing data to review the pending member(s) request
     * @param groupId - The id of the group to review the pending member(s) request
     *
     * @note Only the group leader and deputy group leader can review
     *
     * @throws ZaloApiError
     */
    return async function reviewPendingMemberRequest(payload, groupId) {
        if (!Array.isArray(payload.members))
            payload.members = [payload.members];
        const params = {
            grid: groupId,
            members: payload.members,
            isApprove: payload.isApprove ? 1 : 0, // 1: approve, 0: reject
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
