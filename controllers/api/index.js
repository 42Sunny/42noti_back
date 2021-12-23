const {
  get42Campus,
  get42SeoulCampusEvents,
  get42Event,
  get42User,
  get42UserEvents,
} = require('../../utils/42api');

const SEOUL_CAMPUS_ID = '29';

module.exports = {
  apiCampusController: async (req, res) => {
    try {
      const data = await get42Campus();
      if (!data) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'campus not found',
        });
      }
      if (data) {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
  apiUserController: async (req, res) => {
    const { intraLoginId } = req.params;
    try {
      const originalData = await get42User(intraLoginId);
      if (!originalData) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user not found',
        });
      }
      const { id, email, login, displayname, url } = originalData;
      const data = {
        intraId: id,
        email,
        intraLogin: login,
        displayName: displayname,
        intraProfilePageUrl: url,
      };
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiSeoulCampusEventsController: async (req, res) => {
    try {
      const originalData = await get42SeoulCampusEvents(SEOUL_CAMPUS_ID);
      if (!originalData) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'campus events not found',
        });
      }
      const data = originalData.map(event => {
        const {
          id,
          name,
          description,
          location,
          kind,
          max_people,
          nbr_subscribers,
          begin_at,
          end_at,
          themes,
          created_at,
          updated_at,
        } = event;
        return {
          id,
          title: name,
          description,
          location,
          category: kind,
          maxSubscribers: max_people,
          currentSubscribers: nbr_subscribers,
          beginAt: begin_at,
          endAt: end_at,
          tags: themes.map(theme => theme.name),
          createdAt: created_at,
          updatedAt: updated_at,
        };
      });
      res.json(data);
    } catch (err) {
      console.error(err);
    }
  },
  apiEventController: async (req, res) => {
    const { eventId } = req.params;
    try {
      const originalData = await get42Event(eventId);
      if (!originalData) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'event not found',
        });
      }
      const {
        id,
        name,
        description,
        location,
        kind,
        max_people,
        nbr_subscribers,
        begin_at,
        end_at,
        themes,
        created_at,
        updated_at,
      } = originalData;
      const data = {
        id,
        title: name,
        description,
        location,
        category: kind,
        maxSubscribers: max_people,
        currentSubscribers: nbr_subscribers,
        beginAt: begin_at,
        endAt: end_at,
        tags: themes.map(theme => theme.name),
        createdAt: created_at,
        updatedAt: updated_at,
      };
      if (data) {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventsController: async (req, res) => {
    const { intraLoginId } = req.params;
    try {
      const originalData = await get42UserEvents(intraLoginId);
      if (!originalData) {
        res.status(httpStatus.NOT_FOUND).json({
          message: 'user events not found',
        });
      }
      const data = originalData.map(event => {
        const {
          id,
          name,
          description,
          location,
          kind,
          max_people,
          nbr_subscribers,
          begin_at,
          end_at,
          themes,
          created_at,
          updated_at,
        } = event;
        return {
          id,
          title: name,
          description,
          location,
          category: kind,
          maxSubscribers: max_people,
          currentSubscribers: nbr_subscribers,
          beginAt: begin_at,
          endAt: end_at,
          tags: themes.map(theme => theme.name),
          createdAt: created_at,
          updatedAt: updated_at,
        };
      });
      if (data) {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
};
