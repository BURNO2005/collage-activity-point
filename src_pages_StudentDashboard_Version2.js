import React, { useState, useEffect, useContext } from "react";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch all activities
      const activitiesSnapshot = await getDocs(collection(db, "activities"));
      setActivities(activitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      // Fetch user points
      const userDoc = await getDoc(doc(db, "users", user.uid));
      setUserPoints(userDoc.data()?.points || 0);

      // Fetch user submissions
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("userId", "==", user.uid)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      setSubmissions(submissionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (activityId, proof) => {
    try {
      await addDoc(collection(db, "submissions"), {
        userId: user.uid,
        activityId,
        proof,
        status: "pending",
        createdAt: new Date(),
      });
      alert("Activity submitted for approval!");
      setSelectedActivity(null);
    } catch (error) {
      alert("Error submitting activity: " + error.message);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  const progressPercentage = (userPoints / 60) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Student Dashboard</h1>

        {/* Points Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Activity Points</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-blue-600">{userPoints} / 60</span>
            <span className="text-lg text-gray-600">
              {progressPercentage.toFixed(1)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          {userPoints >= 60 && (
            <p className="mt-4 text-green-600 font-semibold">✓ Minimum points achieved!</p>
          )}
        </div>

        {/* Available Activities */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Available Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{activity.name}</h3>
                <p className="text-gray-600 mb-2">{activity.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold text-lg">+{activity.points} pts</span>
                  <button
                    onClick={() => setSelectedActivity(activity)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-2xl font-semibold mb-4">
                Submit: {selectedActivity.name}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const proof = e.target.proof.value;
                  handleSubmit(selectedActivity.id, proof);
                }}
              >
                <textarea
                  name="proof"
                  placeholder="Describe your activity or paste proof link"
                  className="w-full border rounded p-2 mb-4 h-24"
                  required
                ></textarea>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Submissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Activity</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-t">
                    <td className="p-3">
                      {activities.find((a) => a.id === submission.activityId)?.name || "N/A"}
                    </td>
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
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(submission.createdAt?.toDate()).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;