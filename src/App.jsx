import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";
const initialEvents = [
  { id: 1, title: "Rooftop Sunset Chill", venue: "Skyline Lounge", event_date: "2026-09-05", vibe: "Chill", description: "" },
  { id: 2, title: "Downtown Block Party", venue: "5th Ave", event_date: "2026-09-06", vibe: "Social", description: "" },
  { id: 3, title: "Open Mic Poetry Night", venue: "The Attic", event_date: "2026-09-07", vibe: "Artsy", description: "" },
];

function App() {
  const [selectedVibe, setSelectedVibe] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [deleteError, setDeleteError] = useState(null);

  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [vibe, setVibe] = useState("Chill");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const filteredEvents = selectedVibe === "All"
    ? events
    : events.filter((event) => event.vibe === selectedVibe);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !venue || !eventDate) {
      setFormError("Title, venue, and date are required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const { data, error } = await supabase
      .from("events")
      .insert({ title, venue, event_date: eventDate, vibe, description })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setFormError("Could not save event. Please try again.");
      return;
    }

    setEvents((prev) => [...prev, data]);
    setShowForm(false);
    setTitle("");
    setVenue("");
    setEventDate("");
    setVibe("Chill");
    setDescription("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this event? This cannot be undone.");
    if (!confirmed) return;

    setDeleteError(null);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      setDeleteError("Could not delete event. Please try again.");
      return;
    }

    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <div className="app">
      <header>
        <h1>AfterHours</h1>
        <p>Find your next night out.</p>
        <button className="add-btn" onClick={() => {
          setEditingId(null);
          setTitle("");
          setVenue("");
          setEventDate("");
          setVibe("Chill");
          setDescription("");
          setShowForm(true);
        }}>+ Add Event</button>
      </header>

      {showForm && (
        <div className="event-form">
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="text" placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <select value={vibe} onChange={(e) => setVibe(e.target.value)}>
              <option value="Chill">Chill</option>
              <option value="Social">Social</option>
              <option value="Artsy">Artsy</option>
              <option value="Active">Active</option>
            </select>
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            {formError && <p className="form-error">{formError}</p>}
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Event"}</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="filters">
        <button onClick={() => setSelectedVibe("All")}>All</button>
        <button onClick={() => setSelectedVibe("Chill")}>Chill</button>
        <button onClick={() => setSelectedVibe("Social")}>Social</button>
        <button onClick={() => setSelectedVibe("Artsy")}>Artsy</button>
        <button onClick={() => setSelectedVibe("Active")}>Active</button>
      </div>

      {deleteError && <p className="form-error">{deleteError}</p>}

      <div className="event-list">
        {filteredEvents.map((event) => (
          <div className="event-card" key={event.id}>
            <h3>{event.title}</h3>
            <p>{event.vibe} · {event.event_date}</p>
            <button onClick={() => {
              setEditingId(event.id);
              setTitle(event.title);
              setVenue(event.venue);
              setEventDate(event.event_date);
              setVibe(event.vibe);
              setDescription(event.description);
              setShowForm(true);
            }}>Edit</button>
            <button onClick={() => handleDelete(event.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;