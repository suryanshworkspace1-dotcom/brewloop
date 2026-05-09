"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckinPage() {
  const params = useParams();
  const cafeId = params.cafeId as string;

  const [message, setMessage] = useState("");

  const handleCheckin = async () => {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please login first");
      return;
    }

    // CHECK LAST VISIT
    const { data: lastVisit } = await supabase
      .from("visits")
      .select("*")
      .eq("user_id", user.id)
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastVisit) {
      const lastVisitTime = new Date(lastVisit.created_at).getTime();
      const now = Date.now();

      const hoursPassed =
        (now - lastVisitTime) / (1000 * 60 * 60);

      if (hoursPassed < 12) {
        setMessage(
          `You already checked in recently. Try again later.`
        );
        return;
      }
    }

    // CREATE VISIT
    await supabase.from("visits").insert([
      {
        user_id: user.id,
        cafe_id: cafeId,
        points_earned: 10,
      },
    ]);

    // CHECK EXISTING POINTS
    const { data: existingPoints } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user.id)
      .eq("cafe_id", cafeId)
      .maybeSingle();

    if (existingPoints) {
      await supabase
        .from("loyalty_points")
        .update({
          points: existingPoints.points + 10,
        })
        .eq("id", existingPoints.id);
    } else {
      await supabase.from("loyalty_points").insert([
        {
          user_id: user.id,
          cafe_id: cafeId,
          points: 10,
        },
      ]);
    }

    setMessage("Check-in successful! +10 points");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Cafe Check-In</h1>

      <p>Cafe ID:</p>
      <p>{cafeId}</p>

      <button onClick={handleCheckin}>
        Collect 10 Points
      </button>

      <p>{message}</p>
    </div>
  );
}