const express = require('express');
const router = express.Router();
const {
  getUsers,
  searchUsers,
  getUserById,
  updateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.use(protect);

router.get('/', authorizeRoles('POLICE', 'GOVERNMENT_STAFF', 'ADMIN'), getUsers);
router.get('/search', authorizeRoles('POLICE', 'GOVERNMENT_STAFF', 'ADMIN'), searchUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;
