import { Routes, Route } from "react-router-dom";
import { Box, Container } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import { Home } from "./Home";
import { Copyright } from "./Copyright";

export const Main = () => {
  return (
    <>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
          <Copyright style={{ marginTop: "5em" }} />
        </Container>
      </Box>
    </>
  )
}
