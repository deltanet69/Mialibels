export const getSpmbUrl = () => process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : 'https://spmb.miattaqwa15.sch.id';
export const getAdminUrl = () => process.env.NODE_ENV === 'development' ? 'http://smart.localhost:3000' : 'https://smart.miattaqwa15.sch.id';
export const getParentUrl = () => process.env.NODE_ENV === 'development' ? 'http://parent.localhost:3000' : 'https://parent.miattaqwa15.sch.id';
