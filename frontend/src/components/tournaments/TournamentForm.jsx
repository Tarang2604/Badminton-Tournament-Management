// src/components/tournaments/TournamentForm.jsx — Create/Edit Tournament Modal
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FiX } from 'react-icons/fi';
import { createTournament, updateTournament } from '../../store/slices/tournamentSlice';

const FORMATS = [
  { value: 'single_elimination', label: 'Single Elimination' },
  { value: 'double_elimination', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
];

const CATEGORIES = [
  { value: 'mens_singles', label: "Men's Singles" },
  { value: 'womens_singles', label: "Women's Singles" },
  { value: 'mens_doubles', label: "Men's Doubles" },
  { value: 'womens_doubles', label: "Women's Doubles" },
  { value: 'mixed_doubles', label: 'Mixed Doubles' },
];

function TournamentForm({ tournament = null, onClose }) {
  const dispatch = useDispatch();
  const isEdit = !!tournament;

  const [form, setForm] = useState({
    name:                 tournament?.name || '',
    description:          tournament?.description || '',
    format:               tournament?.format || 'single_elimination',
    category:             tournament?.category || 'mens_singles',
    registrationDeadline: tournament?.registrationDeadline?.slice(0, 10) || '',
    startDate:            tournament?.startDate?.slice(0, 10) || '',
    endDate:              tournament?.endDate?.slice(0, 10) || '',
    'venue.name':         tournament?.venue?.name || '',
    'venue.city':         tournament?.venue?.city || '',
    'venue.address':      tournament?.venue?.address || '',
    maxParticipants:      tournament?.maxParticipants || 16,
    entryFee:             tournament?.entryFee || 0,
    'prizeMoney.first':   tournament?.prizeMoney?.first || 0,
    'prizeMoney.second':  tournament?.prizeMoney?.second || 0,
    rules:                tournament?.rules || '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build nested structure from flat form
    const payload = {
      name:                 form.name,
      description:          form.description,
      format:               form.format,
      category:             form.category,
      registrationDeadline: form.registrationDeadline,
      startDate:            form.startDate,
      endDate:              form.endDate,
      venue: {
        name:    form['venue.name'],
        city:    form['venue.city'],
        address: form['venue.address'],
      },
      maxParticipants: Number(form.maxParticipants),
      entryFee:        Number(form.entryFee),
      prizeMoney: {
        first:  Number(form['prizeMoney.first']),
        second: Number(form['prizeMoney.second']),
      },
      rules: form.rules,
    };

    try {
      if (isEdit) {
        await dispatch(updateTournament({ id: tournament._id, data: payload })).unwrap();
      } else {
        await dispatch(createTournament(payload)).unwrap();
      }
      onClose();
    } catch {
      // Error toasted by slice
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>{isEdit ? '✏️ Edit Tournament' : '🏆 Create Tournament'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="form-group">
            <label className="form-label">Tournament Name *</label>
            <input name="name" className="form-input" required value={form.name} onChange={handleChange}
              placeholder="e.g. Indore Open Badminton 2026" />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange}
              placeholder="Describe the tournament..." />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Format *</label>
              <select name="format" className="form-select" value={form.format} onChange={handleChange}>
                {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Reg. Deadline *</label>
              <input type="date" name="registrationDeadline" className="form-input" required value={form.registrationDeadline} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" name="startDate" className="form-input" required value={form.startDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input type="date" name="endDate" className="form-input" required value={form.endDate} onChange={handleChange} />
          </div>

          {/* Venue */}
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Venue Name *</label>
              <input name="venue.name" className="form-input" required value={form['venue.name']} onChange={handleChange} placeholder="Sports Complex" />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input name="venue.city" className="form-input" required value={form['venue.city']} onChange={handleChange} placeholder="Indore" />
            </div>
          </div>

          {/* Capacity & Fees */}
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Max Players *</label>
              <input type="number" name="maxParticipants" className="form-input" min="2" max="256" required value={form.maxParticipants} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Entry Fee (₹)</label>
              <input type="number" name="entryFee" className="form-input" min="0" value={form.entryFee} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">1st Prize (₹)</label>
              <input type="number" name="prizeMoney.first" className="form-input" min="0" value={form['prizeMoney.first']} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rules / Notes</label>
            <textarea name="rules" className="form-textarea" value={form.rules} onChange={handleChange} placeholder="Tournament rules..." style={{ minHeight: '80px' }} />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Tournament' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TournamentForm;
