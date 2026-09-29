"""Sole Serenity API server."""
import logging

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from database import client
from auth import bootstrap_admin
from seed import seed_all
from routers import public, orders as orders_router, payments, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("soleserenity")

app = FastAPI(title="Sole Serenity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "sole-serenity"}


app.include_router(public.router)
app.include_router(orders_router.router)
app.include_router(payments.router)
app.include_router(admin.router)


@app.on_event("startup")
async def on_startup():
    await bootstrap_admin()
    await seed_all()
    logger.info("Sole Serenity startup complete: admin bootstrapped, defaults seeded.")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
