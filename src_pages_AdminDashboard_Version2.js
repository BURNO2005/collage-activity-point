import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("submissions");
  const [newActivity, setNewActivity] = useState({
    name: "",
    description: "",
    points: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch submissions
    const submissionsSnapshot = await getDocs(collection(db, "submissions"));
    setSubmissions(submissionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    // Fetch activities
    const activitiesSnapshot = await getDocs(collection(db, "activities"));
    setActivities(activitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    // Fetch users
    const usersSnapshot = await getDocs(
      query(collection(db, "users"), where("role", "==", "student"))
    );
    setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

    setLoading(false);
  };

  const handleApproveSubmission = async (submissionId, userId, activityId, points) => {
    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        status: "approved",
      });

      const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", userId)));
      const userRef = doc(db, "users", userId);
      const userSnapshot = await getDocs(collection(db, "users"));
      const userData = userSnapshot.docs.find((d) => d.id === userId);
      
      if (userData) {
        await updateDoc(userRef, {
          points: (userData.data().points || 0) + points,
        });
      }

      alert("Submission approved!");
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleRejectSubmission = async (submissionId) => {
    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        status: "rejected",
      });
      alert("Submission rejected!");
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "activities"), {
        ...newActivity,
        createdAt: new Date(),
      });
      setNewActivity({ name: "", description: "", points: 0 });
      alert("Activity created successfully!");
      fetchData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await deleteDoc(doc(db, "activities", activityId));
        alert("Activity deleted!");
        fetchData();
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {["submissions", "activities", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Pending Submissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Student</th>
                    <th className="p-3 text-left">Activity</th>
                    <th className="p-3 text-left">Proof</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const activity = activities.find((a) => a.id === submission.activityId);
                    const student = users.find((u) => u.id === submission.userId);
                    return (
                      <tr key={submission.id} className="border-t">
                        <td className="p-3">{student?.name || "Unknown"}</td>
                        <td className="p-3">{activity?.name || "Unknown"}</td>
                        <td className="p-3 text-gray-600 truncate">{submission.proof}</td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              submission.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : submission.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {submission.status.charAt(0).toUpperCase() +
                              submission.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-3">
                          {submission.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleApproveSubmission(
                                    submission.id,
                                    submission.userId,
                                    submission.activityId,
                                    activity?.points || 0
                                  )
                                }
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectSubmission(submission.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === "activities" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Create Activity</h2>
              <form onSubmit={handleCreateActivity}>
                <input
                  type="text"
                  placeholder="Activity Name"
                  value={newActivity.name}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, name: e.target.value })
                  }
                  className="w-full border rounded p-2 mb-3"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newActivity.description}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, description: e.target.value })
                  }
                  className="w-full border rounded p-2 mb-3 h-20"
                  required
                ></textarea>
                <input
                  type="number"
                  placeholder="Points"
                  value={newActivity.points}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, points: parseInt(e.target.value) })
                  }
                  className="w-full border rounded p-2 mb-4"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Existing Activities</h2>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="border rounded p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{activity.name}</h3>
                      <p className="text-gray-600 text-sm">{activity.description}</p>
                      <span className="text-blue-600 font-bold">+{activity.points} pts</span>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Student Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Points</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3 font-bold text-blue-600">{user.points || 0}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            (user.points || 0) >= 60
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {(user.points || 0) >= 60 ? "✓ Completed" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;