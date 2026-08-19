const express = require('express');
const multer = require('multer');

const { attachmentController } = require('../controller/attachment-controller');

const attachmentRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 26214400
    }
});

attachmentRouter.get('/', attachmentController.getAttachments);
attachmentRouter.get('/:attachmentid', attachmentController.getAttachment);
attachmentRouter.post('/', upload.single('file'), attachmentController.addAttachment);
attachmentRouter.put('/:attachmentid', attachmentController.updateAttachment);
attachmentRouter.delete('/:attachmentid', attachmentController.deleteAttachment);

module.exports = {
    attachmentRouter
};