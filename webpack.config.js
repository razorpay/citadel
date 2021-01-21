const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProd ? 'production' : 'development',
  resolve: {
    modules: process.env.NODE_PATH.split(':').filter(_=>_),
  }
}