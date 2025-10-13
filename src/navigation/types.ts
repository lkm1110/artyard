/**
 * 네비게이션 타입 정의
 */

import type { Artwork, Profile } from '../types';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainApp: undefined;
  ArtworkDetail: {
    artworkId: string;
  };
  ArtworkEdit: {
    artwork: Artwork;
  };
  ProfileEdit: undefined;
  ArtworkUpload: undefined;
  Chat: {
    chatId: string;
    otherUserId: string;
    artworkId?: string;
  };
  BookmarksScreen: undefined;
  MyArtworksScreen: undefined;
};

export type TabParamList = {
  Home: undefined;
  Upload: undefined;
  Messages: undefined;
  Profile: undefined;
};
