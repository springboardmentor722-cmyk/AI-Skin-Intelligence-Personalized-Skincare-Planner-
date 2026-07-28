import { useState } from "react";
import {
  Box, Stack, Typography, Avatar, IconButton, InputBase, Paper, Divider, Button
} from "@mui/material";
import {
  Search, ChatBubbleOutlineOutlined
} from "@mui/icons-material";
import { COLORS } from "../theme/colors";

const cPrimary = COLORS.primary || "#8B6FC9";
const cCardBorder = COLORS.cardBorder || "#F6F4F8";
const cTextDark = COLORS.textDark || "#2D3748";
const cTextMuted = COLORS.textMuted || "#718096";

export default function ConsultantMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 1600, mx: "auto", width: "100%", backgroundColor: "#FAF8FC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: cTextDark, mb: 0.5 }}>Messages</Typography>
          <Typography sx={{ fontSize: 13, color: cTextMuted }}>Secure communication with your clients.</Typography>
        </Box>
      </Stack>

      <Paper sx={{ borderRadius: "20px", border: "1px solid " + cCardBorder, overflow: "hidden", boxShadow: "0 4px 18px rgba(139,111,201,0.03)", backgroundColor: "#fff", display: "flex", flexGrow: 1, minHeight: 600 }}>
        
        {/* Sidebar */}
        <Box sx={{ width: 320, borderRight: `1px solid ${cCardBorder}`, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${cCardBorder}` }}>
            <Paper sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderRadius: "12px", border: `1px solid ${cCardBorder}`, boxShadow: "none", backgroundColor: "#FAF8FC" }}>
              <Search sx={{ color: cTextMuted, fontSize: 18, mr: 1 }} />
              <InputBase placeholder="Search conversations..." sx={{ fontSize: 13, flex: 1, color: cTextDark }} />
            </Paper>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 0 }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: 13, color: cTextMuted }}>No active conversations.</Typography>
              </Box>
            ) : null}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", backgroundColor: "#FDFCFE" }}>
          {activeChat ? (
            <Box>Chat Area</Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <ChatBubbleOutlineOutlined sx={{ fontSize: 64, color: cCardBorder, mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: cTextDark, mb: 1 }}>Your Messages</Typography>
              <Typography sx={{ fontSize: 13, color: cTextMuted }}>Select a conversation from the sidebar to start messaging.</Typography>
            </Box>
          )}
        </Box>

      </Paper>
    </Box>
  );
}
