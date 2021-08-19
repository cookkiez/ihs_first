module.exports = {
    module: {
      rules: [
        {
          test: /\.distCorr\.(c|m)?js$/i,
          loader: "worker-loader",
          options: {
            esModule: false,
          },
        },
      ],
    },
  };