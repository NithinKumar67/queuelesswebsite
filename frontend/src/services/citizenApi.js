import { requestJson } from "./apiClient";

export const getOffices = () => requestJson("/offices");

export const getOfficeById = (officeId) => requestJson(`/offices/${officeId}`);

export const getOfficeServices = (officeId) =>
  requestJson(`/offices/${officeId}/services`);

export const getQueueInfo = (officeId, serviceId) =>
  requestJson(`/offices/${officeId}/services/${serviceId}/queue`);

export const createToken = (officeId, serviceId) =>
  requestJson("/tokens", { method: "POST", body: { officeId, serviceId } });

export const getTokenDetails = (tokenId) => requestJson(`/tokens/${tokenId}`);

export const cancelToken = (tokenId) =>
  requestJson(`/tokens/${tokenId}/cancel`, { method: "PATCH" });

export const getOfficePeakHours = (officeId) =>
  requestJson(`/offices/${officeId}/analytics/peak-hours`);

export const getMyActiveToken = () => requestJson("/tokens/my-active");
