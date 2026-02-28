import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUsers, FaChevronLeft, FaClock } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
    PageHeader,
    DataTable,
    Badge,
    Button,
    SearchBar,
  } from "../../../components/Admin";
import { competitionAPI } from "../../../services/api";
import styles from "./CompetitionParticipants.module.css";

function CompetitionParticipants() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompetition = useCallback(async () => {
    setLoading(true);
    try {
      const response = await competitionAPI.getById(id);
      if (response.success && response.data) {
        setCompetition(response.data);
        setParticipants(Array.isArray(response.data.participants) ? response.data.participants : []);
      } else {
        toast.error("Unable to load competition");
      }
    } catch (error) {
      console.error("Failed to load competition", error);
      toast.error("Failed to load competition");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    const term = searchTerm.toLowerCase();
    return participants.filter((p) => {
      const name = (p.user?.name || "").toLowerCase();
      const email = (p.user?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [participants, searchTerm]);

  const tableData = useMemo(
    () =>
      filteredParticipants.map((p, index) => ({
        ...p,
        rowNumber: index + 1,
      })),
    [filteredParticipants]
  );

  const participantColumns = [
    {
      key: "rowNumber",
      label: "#",
      width: "60px",
      render: (val) => `#${val}`,
    },
    {
      key: "name",
      label: "Name",
      render: (_, row) =>
        row.user?.name || row.user?.email || "Unknown User",
    },
    {
      key: "email",
      label: "Email",
      render: (_, row) => row.user?.email || "—",
    },
    {
      key: "joinedAt",
      label: "Joined",
      render: (_, row) => {
        const joined = row.joinedAt || row.createdAt;
        return joined ? new Date(joined).toLocaleString() : "—";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const status = row.status || row.paymentStatus || "Registered";
        const variantMap = {
          Registered: "info",
          registered: "info",
          Active: "success",
          active: "success",
          Pending: "warning",
          pending: "warning",
        };
        const variant = variantMap[status] || "default";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      key: "score",
      label: "Score",
      render: (_, row) => row.score ?? row.points ?? "—",
    },
  ];

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <PageHeader
        icon={FaUsers}
        title="Competition Participants"
        subtitle={
          competition
            ? competition.name || competition.title || "Competition"
            : "Loading competition..."
        }
        action={
          <Button variant="secondary" icon={FaChevronLeft} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <FaUsers />
          <div>
            <div className={styles.summaryLabel}>Total Registered</div>
            <div className={styles.summaryValue}>
              {participants.length}
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <FaClock />
          <div>
            <div className={styles.summaryLabel}>Start Time</div>
            <div className={styles.summaryValue}>
              {competition?.startTime
                ? new Date(competition.startTime).toLocaleString()
                : "TBA"}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search participants by name or email..."
        />
        <div className={styles.count}>
          Showing {tableData.length} of {participants.length} participants
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading participants...</div>
      ) : (
        <DataTable
          columns={participantColumns}
          data={tableData}
          emptyMessage="No participants found for this competition"
        />
      )}
    </div>
  );
}

export default CompetitionParticipants;


