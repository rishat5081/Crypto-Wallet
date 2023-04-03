const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/cryptoIcons/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    // reject a file
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});
module.exports = upload;