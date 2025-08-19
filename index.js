import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors"

dotenv.config();
const app = express();
app.use(cors());
app.get("/api/listings/Property", async (req, res) => {
  try {
    const response = await fetch("https://replication.sparkapi.com/Version/3/Reso/OData/Property?$orderby=ModificationTimestamp desc&$top=100&$expand=Media", {
      headers: {
        Authorization: `Bearer ${process.env.SPARK_API_KEY}`,
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// Example: Proxy route for Spark API
app.get("/api/properties/filter", async (req, res) => {
  try {
    const { city, min, max, bedrooms, bathrooms, property, listingType } = req.query;

    let baseUrl = `https://replication.sparkapi.com/Version/3/Reso/OData/Property?$orderby=ModificationTimestamp%20desc&$top=100&$expand=Media`;

    // collect OData filters
    let filters = [];

    if (city) {
      filters.push(`City eq '${city}'`);
    }

    if (property) {
      filters.push(`PropertyType eq '${property}'`);
    } else if (listingType) {
      if (listingType === "Buy") {
        const buyTypes = [
          "Residential",
          "Residential Income",
          "Land",
          "Commercial Sale",
          "Farm",
          "Multi-Family",
        ];
        filters.push(
          buyTypes.map(type => `PropertyType eq '${type}'`).join(" or ")
        );
      } else if (listingType === "Rent") {
        const rentTypes = [
          "Residential Lease",
          "Commercial Lease",
        ];
        filters.push(
          rentTypes.map(type => `PropertyType eq '${type}'`).join(" or ")
        );
      }
    }

    if (min && max) {
      filters.push(`ListPrice ge ${min} and ListPrice le ${max}`);
    } else if (min) {
      filters.push(`ListPrice ge ${min}`);
    } else if (max) {
      filters.push(`ListPrice le ${max}`);
    }

    if (bedrooms) {
      filters.push(`BedroomsTotal eq ${bedrooms}`);
    }

    if (bathrooms) {
      filters.push(`BathroomsTotalInteger eq ${bathrooms}`);
    }

    // add filters to URL (encoded!)
    let url = baseUrl;
    if (filters.length > 0) {
      url += `&$filter=${encodeURIComponent(filters.join(" and "))}`;
    }

    console.log("✅ Spark API URL:", url);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.SPARK_API_KEY}`,
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch from Spark API" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));


