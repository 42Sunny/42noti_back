const {
  get42Campus,
  get42CampusEvents,
  get42User,
  get42UserEvents,
} = require('../../utils/42api');

const SEOUL_CAMPUS_ID = '29';

module.exports = {
  apiCampusController: async (req, res) => {
    try {
      const data = await get42Campus();
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
      const data = await get42User(intraLoginId);
      if (data) {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
  apiCampusEventsController: async (req, res) => {
    try {
      const originalData = await get42CampusEvents(SEOUL_CAMPUS_ID);
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
        console.log(data[0]);
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
  apiUserEventsController: async (req, res) => {
    const { intraLoginId } = req.params;
    try {
      const data = await get42UserEvents(intraLoginId);
      if (data) {
        res.json(data);
      }
    } catch (err) {
      console.error(err);
    }
  },
};
