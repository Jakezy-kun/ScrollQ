import { colors } from '@/styles/tokens';

export type FaceShape = 'circle' | 'squircle' | 'blob' | 'drop';
export type Eyes = 'dots' | 'happy' | 'wide' | 'wink' | 'glasses';
export type Mouth = 'smile' | 'open' | 'flat' | 'grin';
export type Extra = 'none' | 'antenna' | 'ears' | 'leaf' | 'spark';

export interface AvatarDef {
  id: string;
  name: string;
  bg: string;
  face: string;
  shape: FaceShape;
  eyes: Eyes;
  mouth: Mouth;
  extra: Extra;
}

/** The 8 built-in illustrated avatars. Players pick one; no photo uploads. */
export const AVATARS: readonly AvatarDef[] = [
  {
    id: 'sunny',
    name: 'Sunny',
    bg: colors.amber,
    face: '#FFE3A3',
    shape: 'circle',
    eyes: 'happy',
    mouth: 'grin',
    extra: 'spark',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    bg: colors.violet,
    face: '#C9BEFF',
    shape: 'squircle',
    eyes: 'dots',
    mouth: 'flat',
    extra: 'antenna',
  },
  {
    id: 'minty',
    name: 'Minty',
    bg: colors.mint,
    face: '#B5F0E1',
    shape: 'blob',
    eyes: 'wide',
    mouth: 'smile',
    extra: 'leaf',
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: colors.coral,
    face: '#FFC2CD',
    shape: 'drop',
    eyes: 'wink',
    mouth: 'open',
    extra: 'none',
  },
  {
    id: 'scout',
    name: 'Scout',
    bg: '#22385E',
    face: '#9FC2F0',
    shape: 'circle',
    eyes: 'glasses',
    mouth: 'smile',
    extra: 'none',
  },
  {
    id: 'mochi',
    name: 'Mochi',
    bg: '#5B2645',
    face: '#F2B8D3',
    shape: 'circle',
    eyes: 'dots',
    mouth: 'smile',
    extra: 'ears',
  },
  {
    id: 'nova',
    name: 'Nova',
    bg: colors['surface-2'],
    face: '#E4DEFF',
    shape: 'squircle',
    eyes: 'happy',
    mouth: 'open',
    extra: 'spark',
  },
  {
    id: 'fern',
    name: 'Fern',
    bg: '#1E4A47',
    face: '#A8E6C9',
    shape: 'drop',
    eyes: 'wide',
    mouth: 'grin',
    extra: 'leaf',
  },
];

export function findAvatar(id: string | null | undefined): AvatarDef | undefined {
  return AVATARS.find((a) => a.id === id);
}
