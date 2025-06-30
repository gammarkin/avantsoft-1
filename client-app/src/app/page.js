"use client";

import axios from "axios";
import { API_BASE_URL } from "./config";
import { useEffect } from "react";

import UserTab from "../components/UserTab";
import SalesTab from "../components/SalesTab";

import { Tabs, Text } from "@mantine/core";

export default function Home() {
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/users/confirm?token=${token}`, {
          headers: {
            Authorization: token,
          },
        });

        if (response.status !== 200) {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Token validation failed:", error);

        console.log("Token validation failed:", error);

        localStorage.removeItem("token");
        window.location.href = "/login";

        return false;
      }
    }

    checkToken();
  }, []);

  return (
    <Tabs defaultValue="Users">
      <Tabs.List grow>
        <Tabs.Tab value="Users">
          <Text>User Tab</Text>
        </Tabs.Tab>
        <Tabs.Tab value="Sales">
          <Text>Sales tab</Text>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="Users">
        <UserTab />
      </Tabs.Panel>
      <Tabs.Panel value="Sales">
        <SalesTab />
      </Tabs.Panel>
    </Tabs>
  );
}
