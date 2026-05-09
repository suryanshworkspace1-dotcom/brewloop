import QRCode from "react-qr-code";
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Cafe = {
  id: string;
  cafe_name: string;
};

type Reward = {
  id: string;
  reward_name: string;
  points_required: number;
};

type LoyaltyPoint = {
  id: string;
  user_id: string;
  points: number;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [cafeName, setCafeName] = useState("");
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [pointsRequired, setPointsRequired] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPoints, setCustomerPoints] = useState("");
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoint[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getUser();
    fetchCafes();
  }, []);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setEmail(user.email || "");
    }
  };

  const fetchCafes = async () => {
    const { data } = await supabase
      .from("cafes")
      .select("*");

    if (data) {
      setCafes(data);

      if (data.length > 0) {
        setSelectedCafe(data[0].id);
        fetchRewards(data[0].id);
        fetchLoyalty(data[0].id);
      }
    }
  };

  const fetchRewards = async (cafeId: string) => {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .eq("cafe_id", cafeId);

    if (data) {
      setRewards(data);
    }
  };

  const fetchLoyalty = async (cafeId: string) => {
    const { data } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("cafe_id", cafeId);

    if (data) {
      setLoyaltyData(data);
    }
  };

  const createCafe = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("cafes").insert([
      {
        owner_id: user.id,
        cafe_name: cafeName,
      },
    ]);

    if (!error) {
      setCafeName("");
      fetchCafes();
    }
  };

  const createReward = async () => {
    const { error } = await supabase.from("rewards").insert([
      {
        cafe_id: selectedCafe,
        reward_name: rewardName,
        points_required: Number(pointsRequired),
      },
    ]);

    if (!error) {
      setRewardName("");
      setPointsRequired("");
      fetchRewards(selectedCafe);
    }
  };

  const addPoints = async () => {
    const { data: users } = await supabase.auth.admin.listUsers();

    const foundUser = users?.users?.find(
      (u) => u.email === customerEmail
    );

    if (!foundUser) {
      setMessage("Customer not found");
      return;
    }

    const { error } = await supabase
      .from("loyalty_points")
      .insert([
        {
          user_id: foundUser.id,
          cafe_id: selectedCafe,
          points: Number(customerPoints),
        },
      ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Points added!");
      setCustomerEmail("");
      setCustomerPoints("");
      fetchLoyalty(selectedCafe);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <p>{email}</p>

      <hr style={{ margin: "20px 0" }} />

      <h2>Create Cafe</h2>

      <input
        placeholder="Cafe Name"
        value={cafeName}
        onChange={(e) => setCafeName(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <button onClick={createCafe}>
        Create Cafe
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Your Cafes</h2>

      {cafes.map((cafe) => (
  <div
    key={cafe.id}
    onClick={() => {
      setSelectedCafe(cafe.id);
      fetchRewards(cafe.id);
      fetchLoyalty(cafe.id);
    }}
    style={{
      border: "1px solid gray",
      padding: 10,
      marginBottom: 10,
      cursor: "pointer",
    }}
  >
    <h3>{cafe.cafe_name}</h3>

    <div
      style={{
        background: "white",
        padding: 10,
        width: 120,
        marginTop: 10,
      }}
    >
      <QRCode
        value={`http://localhost:3000/checkin/${cafe.id}`}
      />
    </div>
  </div>
))}

      <hr style={{ margin: "20px 0" }} />

      <h2>Create Reward</h2>

      <input
        placeholder="Reward Name"
        value={rewardName}
        onChange={(e) => setRewardName(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <input
        placeholder="Points Required"
        value={pointsRequired}
        onChange={(e) => setPointsRequired(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <button onClick={createReward}>
        Create Reward
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Rewards</h2>

      {rewards.map((reward) => (
        <div
          key={reward.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p>{reward.reward_name}</p>
          <p>{reward.points_required} points</p>
        </div>
      ))}

      <hr style={{ margin: "20px 0" }} />

      <h2>Add Customer Points</h2>

      <input
        placeholder="Customer Email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <input
        placeholder="Points"
        value={customerPoints}
        onChange={(e) => setCustomerPoints(e.target.value)}
        style={{ display: "block", margin: 10, padding: 8 }}
      />

      <button onClick={addPoints}>
        Add Points
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Loyalty Data</h2>

      {loyaltyData.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p>User ID: {item.user_id}</p>
          <p>Points: {item.points}</p>
        </div>
      ))}

      <p>{message}</p>
    </div>
  );
}