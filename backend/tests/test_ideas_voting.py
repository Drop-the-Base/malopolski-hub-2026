import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_ideas_voting_and_admin_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login with judge prefilled credentials
        login_res = await ac.post("/api/v1/auth/login", json={
            "username": "sedzia.hackyeah@malopolska.pl",
            "password": settings.ADMIN_PASSWORD
        })
        assert login_res.status_code == 200
        auth_data = login_res.json()
        assert "access_token" in auth_data
        assert auth_data["user_role"] == "judge"
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Submit new idea via creator
        idea_payload = {
            "title": "Centrum Wolontariatu Sąsiedzkiego w Zakopanem",
            "summary": "Mieszkańcy Zakopanego chcą pomagać samotnym seniorom w zimie w odśnieżaniu i zakupach.",
            "target_audience": "Samotni seniorzy w powiecie tatrzańskim",
            "implementation_stage": "pomysl",
            "author_name": "Tatrzańskie Koło Społeczne",
            "author_email": "kontakt@tatry-pomoc.example.org",
            "author_type": "ngo",
            "powiat": "tatrzański",
            "rodo_consent": True
        }
        create_res = await ac.post("/api/v1/ideas", json=idea_payload)
        assert create_res.status_code == 200
        created_idea = create_res.json()
        idea_id = created_idea["id"]
        assert created_idea["votes_count"] == 0

        # 3. Check that idea landed in voting in testing
        voting_res = await ac.get("/api/v1/ideas/voting")
        assert voting_res.status_code == 200
        voting_list = voting_res.json()
        assert any(item["id"] == idea_id for item in voting_list)

        # 4. Cast a vote in testing
        vote_res = await ac.post(f"/api/v1/ideas/{idea_id}/vote")
        assert vote_res.status_code == 200
        vote_data = vote_res.json()
        assert vote_data["votes_count"] == 1

        # 5. Admin updates the proposal (Approve, Group, Change)
        update_res = await ac.patch(f"/api/v1/ideas/{idea_id}", headers=headers, json={
            "title": "Centrum Wolontariatu Sąsiedzkiego Tatry (Zweryfikowane)",
            "cluster_group": "Pakiet Zimowy Senioralny",
            "status": "approved",
            "admin_notes": "Zatwierdzono do testów terenowych przez ROPS Kraków."
        })
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["title"] == "Centrum Wolontariatu Sąsiedzkiego Tatry (Zweryfikowane)"
        assert updated["cluster_group"] == "Pakiet Zimowy Senioralny"
        assert updated["status"] == "approved"
        assert updated["votes_count"] == 1
