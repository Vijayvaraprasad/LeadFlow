import { leadService } from '../services/lead.service.js';

export const getLeads = (req, res, next) => {
  try {
    const { page, limit, status, assigned_to, search, sort, order } = req.query;
    const result = leadService.getLeads({
      page, limit, status, assigned_to, search, sort, order,
      userId: req.user.id,
      userRole: req.user.role
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getLeadById = (req, res, next) => {
  try {
    const lead = leadService.getLeadById(req.params.id, req.user.id, req.user.role);
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const captureLead = (req, res, next) => {
  try {
    const lead = leadService.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

export const updateLead = (req, res, next) => {
  try {
    const lead = leadService.updateLead(req.params.id, req.body, req.user.id, req.user.role);
    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const deleteLead = (req, res, next) => {
  try {
    leadService.deleteLead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const addNote = (req, res, next) => {
  try {
    const note = leadService.addNote(req.params.id, req.user.id, req.body.content);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const getActivity = (req, res, next) => {
  try {
    const activity = leadService.getActivity(req.params.id);
    res.json(activity);
  } catch (error) {
    next(error);
  }
};

export const getStats = (req, res, next) => {
  try {
    const stats = leadService.getStats(req.user.id, req.user.role);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
