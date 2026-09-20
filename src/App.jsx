import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

const vibeImages = {
  Chill: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80",
  Social: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&q=80",
  Artsy: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
  Active: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
};

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
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [vibe, setVibe] = useState("Chill");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = selectedVibe === "All"
    ? events
    : events.filter((event) => event.vibe === selectedVibe);

  useEffect(() => {
    fetch("https://afterhours-backend-d7mu.onrender.com/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to load events:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !venue || !eventDate) {
      setFormError("Title, venue, and date are required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    let imageUrl = null;

    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        setSaving(false);
        setFormError("Could not upload image. Please try again.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    let data, error;

    if (editingId) {
      const updatePayload = { title, venue, event_date: eventDate, vibe, description };
      if (imageUrl) updatePayload.image_url = imageUrl;

      ({ data, error } = await supabase
        .from("events")
        .update(updatePayload)
        .eq("id", editingId)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from("events")
        .insert({ title, venue, event_date: eventDate, vibe, description, image_url: imageUrl })
        .select()
        .single());
    }

    setSaving(false);

    if (error) {
      setFormError("Could not save event. Please try again.");
      return;
    }

    if (editingId) {
      setEvents((prev) => prev.map((ev) => (ev.id === editingId ? data : ev)));
    } else {
      setEvents((prev) => [...prev, data]);
    }

    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setVenue("");
    setEventDate("");
    setVibe("Chill");
    setDescription("");
    setImageFile(null);
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

  if (selectedEvent) {
    return (
      <div className="app">
        <div className="detail-page">
          <button className="back-btn" onClick={() => setSelectedEvent(null)}>← Back</button>
          <img
            src={selectedEvent.image_url || vibeImages[selectedEvent.vibe] || vibeImages.Chill}
            alt={selectedEvent.title}
            className="detail-img"
          />
          <h2>{selectedEvent.title}</h2>
          <p><strong>{selectedEvent.venue}</strong> · {selectedEvent.event_date}</p>
          <p className="detail-vibe">{selectedEvent.vibe}</p>
          <p>{selectedEvent.description || "No description provided."}</p>
        </div>
      </div>
    );
  }

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
          setImageFile(null);
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
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
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
          <div className="event-card" key={event.id} onClick={() => setSelectedEvent(event)}>
            <img
              src={event.image_url || vibeImages[event.vibe] || vibeImages.Chill}
              alt={event.title}
              className="event-card-img"
            />
            <h3>{event.title}</h3>
            <p>{event.vibe} · {event.event_date}</p>
            <button onClick={(e) => {
              e.stopPropagation();
              setEditingId(event.id);
              setTitle(event.title);
              setVenue(event.venue);
              setEventDate(event.event_date);
              setVibe(event.vibe);
              setDescription(event.description);
              setShowForm(true);
            }}>Edit</button>
            <button onClick={(e) => {
              e.stopPropagation();
              handleDelete(event.id);
            }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;