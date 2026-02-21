const express = require('express');
const meetingController = require('../controllers/meetingController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, meetingController.listMeetings);
router.get('/:id', auth, meetingController.getMeeting);
router.post('/create', auth, meetingController.createMeeting);
router.post('/:id/propose', auth, meetingController.proposeTime);
router.post('/:id/approve', auth, meetingController.approveTime);
router.post('/:id/message', auth, meetingController.sendMessage);
router.get('/:id/calendar', auth, meetingController.viewCalendar);
router.post('/:id/move', auth, meetingController.moveMeeting);

module.exports = router;
