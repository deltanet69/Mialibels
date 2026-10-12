export const getSpmbUrl = () => {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const port = window.location.port ? `:${window.location.port}` : '';
    if (isLocal) {
      return `http://spmb.localhost${port}`;
    }
    return 'https://spmb.miattaqwa15.sch.id';
  }
  return process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : 'https://spmb.miattaqwa15.sch.id';
};
export const getAdminUrl = () => process.env.NODE_ENV === 'development' ? 'http://smart.localhost:3000' : 'https://smart.miattaqwa15.sch.id';
export const getParentUrl = () => process.env.NODE_ENV === 'development' ? 'http://parent.localhost:3000' : 'https://parent.miattaqwa15.sch.id';
