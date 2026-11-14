import type {
  ActivityTemplate,
  AgeBand,
  MediaKind,
  Riwayah,
  Section,
} from '../../common/constants/domain';

/** Message sent to the pack-building queue. */
export interface PackJobMessage {
  packId: string;
}

/**
 * The file the app downloads to learn what content exists. It lists every approved item and every
 * media file with its size and checksum, so the app can download only what it is missing,
 * show download sizes to parents, and verify files after download.
 */
export interface PackManifest {
  schemaVersion: 1;
  packVersion: number;
  generatedAt: string;
  mediaBaseUrl: string;
  totalBytes: number;
  sections: Partial<Record<Section, { itemCount: number; bytes: number }>>;
  items: {
    id: string;
    slug: string;
    revision: number;
    title: string;
    section: Section;
    template: ActivityTemplate;
    ageBands: AgeBand[];
    skills: string[];
    riwayah: Riwayah | null;
    source: string | null;
    data: Record<string, unknown>;
    mediaIds: string[];
  }[];
  media: {
    id: string;
    kind: MediaKind;
    key: string;
    contentType: string;
    bytes: number;
    sha256: string;
  }[];
}
