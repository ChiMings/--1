import request from '@/utils/request';

/**
 * 上传单个文件
 * @param {File} file 要上传的文件
 */
export function uploadSingleFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return request({
    url: '/upload/single',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 上传多个文件
 * @param {File[]} files 要上传的文件数组
 */
export function uploadMultipleFiles(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  return request({
    url: '/upload/multiple',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 删除文件
 * @param {string} filename 文件名
 */
export function deleteFile(filename) {
  return request({
    url: `/upload/${filename}`,
    method: 'delete',
  });
} 