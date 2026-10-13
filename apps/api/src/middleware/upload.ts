import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const makeStorage = (subdir: string, prefix: string): multer.StorageEngine =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(__dirname, '..', '..', 'uploads', subdir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const uploadEvent = multer({ storage: makeStorage('events', 'event'), fileFilter: imageFilter });
export const uploadPhoto = multer({ storage: makeStorage('photos', 'photo'), fileFilter: imageFilter });
export const uploadRecap = multer({
  storage: makeStorage('recaps', 'recap'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
export const uploadSponsor = multer({ storage: makeStorage('sponsors', 'sponsor'), fileFilter: imageFilter });
export const uploadPhotographer = multer({
  storage: makeStorage('photographers', 'photographer'),
  fileFilter: imageFilter,
});
export const uploadSettings = multer({ storage: makeStorage('settings', 'setting'), fileFilter: imageFilter });
