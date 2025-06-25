// ApplicationsInbox.jsx

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Inbox.css';

function ApplicationsInbox() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('employer_id', user.id);

    if (!error) setApplications(data);
  };

  const handleAccept = async (application) => {
    const { id, user_id } = application;

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (updateError) {
      console.error('❌ Failed to update status:', updateError.message);
      return;
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: user_id,
          type: 'application',
          message: '🎉 Your application was accepted!',
        },
      ]);

    if (notifError) {
      console.warn('⚠️ Notification insert failed:', notifError.message);
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: 'accepted' } : app
      )
    );
  };

  return (
    <div className="applications-inbox-wrapper">
      <div className="inbox-title">Inbox</div>
      <div className="applications-inbox-scroll">
        {applications.map((app) => (
          <div key={app.id} className="inbox-card">
            <img src="/default-avatar.png" alt="avatar" className="avatar" />
            <div><strong>{app.full_name}</strong></div>
            <div><strong>District:</strong> {app.district}</div>
            <div><strong>Sector:</strong> {app.sector}</div>
            <div><strong>Cell:</strong> {app.cell}</div>
            <div><strong>Village:</strong> {app.village}</div>
            <div><strong>Message:</strong> {app.message}</div>
            <div><strong>Status:</strong> {app.status}</div>
            <div className="submitted-date">Submitted: {new Date(app.created_at).toLocaleString()}</div>

            {app.status === 'accepted' ? (
              <button className="btn accepted">Accepted</button>
            ) : (
              <>
                <button className="btn" onClick={() => handleAccept(app)}>Accept</button>
                <button className="btn reject">Reject</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApplicationsInbox;
