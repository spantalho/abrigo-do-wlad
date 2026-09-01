export type ThirdPartyImage = {
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

type ThirdPartyImageGroup = {
  [key: string]: ThirdPartyImage | ThirdPartyImageGroup;
};

export type ThirdPartyImagesData = {
  [key: string]: ThirdPartyImage | ThirdPartyImageGroup;
};
