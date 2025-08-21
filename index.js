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


app.get("/api/properties/filter", async (req, res) => {
  try {
    const { city, min, max, bedrooms, bathrooms, property, listingType } = req.query;

    let baseUrl = `https://replication.sparkapi.com/Version/3/Reso/OData/Property?$orderby=ModificationTimestamp%20desc&$top=100&$expand=Media`;

    // Collect OData filters
    let filters = [];

    if (city) {
      filters.push(`City eq '${encodeURIComponent(city)}'`);
    }

    // Handle PropertyType and ListingType logic
    if (property) {
      filters.push(`PropertyType eq '${encodeURIComponent(property)}'`);
    } else if (listingType) {
      let typeFilters = [];
      if (listingType === "Buy") {
        typeFilters = [
          "Residential",
          "Residential Income",
          "Land",
          "Commercial Sale",
          "Farm",
          "Multi-Family",
        ].map(type => `PropertyType eq '${type}'`);
      } else if (listingType === "Rent") {
        typeFilters = [
          "Residential Lease",
          "Commercial Lease",
        ].map(type => `PropertyType eq '${type}'`);
      }
      // Group the OR conditions with parentheses
      if (typeFilters.length > 0) {
        filters.push(`(${typeFilters.join(' or ')})`);
      }
    }

    // Price filters
    if (min && max) {
      filters.push(`ListPrice ge ${min} and ListPrice le ${max}`);
    } else if (min) {
      filters.push(`ListPrice ge ${min}`);
    } else if (max) {
      filters.push(`ListPrice le ${max}`);
    }

    // Bedrooms filter
    if (bedrooms) {
      filters.push(`BedroomsTotal ge ${bedrooms}`);
    }

    // Bathrooms filter
    if (bathrooms) {
      filters.push(`BathroomsTotalInteger ge ${bathrooms}`);
    }

    // Add filters to URL
    let url = baseUrl;
    if (filters.length > 0) {
      // Join all filters with 'and' and encode the entire filter string
      const filterString = filters.join(' and ');
      url += `&$filter=${encodeURIComponent(filterString)}`;
    }

    // console.log("✅ Spark API URL:", url);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.SPARK_API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Spark API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Failed to fetch from Spark API", details: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));


