import { apiRequest } from "./queryClient";

export async function uploadToDrive(formId: number, submissionData: any) {
  const response = await apiRequest(
    "POST", 
    `/api/forms/${formId}/submissions/upload`,
    submissionData
  );
  return response.json();
}

export async function getFileUrl(fileId: string) {
  const response = await apiRequest(
    "GET",
    `/api/drive/files/${fileId}`
  );
  return response.json();
}
