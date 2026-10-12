import * as migration_20261007_073935_initial from './20261007_073935_initial';
import * as migration_20261008_173203_media_add_sizes_and_kind from './20261008_173203_media_add_sizes_and_kind';
import * as migration_20261008_173232_media_drop_old_thumbnail from './20261008_173232_media_drop_old_thumbnail';
import * as migration_20261012_073543_taxonomy_skills_locations from './20261012_073543_taxonomy_skills_locations';

export const migrations = [
  {
    up: migration_20261007_073935_initial.up,
    down: migration_20261007_073935_initial.down,
    name: '20261007_073935_initial',
  },
  {
    up: migration_20261008_173203_media_add_sizes_and_kind.up,
    down: migration_20261008_173203_media_add_sizes_and_kind.down,
    name: '20261008_173203_media_add_sizes_and_kind',
  },
  {
    up: migration_20261008_173232_media_drop_old_thumbnail.up,
    down: migration_20261008_173232_media_drop_old_thumbnail.down,
    name: '20261008_173232_media_drop_old_thumbnail',
  },
  {
    up: migration_20261012_073543_taxonomy_skills_locations.up,
    down: migration_20261012_073543_taxonomy_skills_locations.down,
    name: '20261012_073543_taxonomy_skills_locations'
  },
];
