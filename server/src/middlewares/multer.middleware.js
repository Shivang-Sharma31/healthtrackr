import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "./public/temp";

        // Check if the directory exists, if not, create it dynamically
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const sanitizedName = file.originalname.replace(/\s+/g, "_");
        const uniqueName = Date.now() + "-" + sanitizedName;
        cb(null, uniqueName);
    },
}); 

export const upload = multer({
    storage,
});
