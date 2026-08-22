type ThirdPartyImage = {
  photoId: string;
  author: {
    name: string;
    profileUrl: string;
  };
  license: {
    name: string;
    url: string;
  };
};

export type ThirdPartyImagesData = {
  [key: string]: ThirdPartyImage;
};
