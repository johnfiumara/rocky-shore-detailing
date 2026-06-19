import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeRichText } from "@/lib/sanitize";

describe("sanitizeHtml - XSS Prevention", () => {
  describe("XSS Attack Prevention", () => {
    it("should remove img tag with onerror XSS payload", () => {
      const dirty = '<img src=x onerror="alert(\'xss\')">';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("");
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    it("should remove script tags and their content", () => {
      const dirty = "<script>alert('xss')</script>";
      const result = sanitizeHtml(dirty);
      expect(result).toBe("");
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("should remove inline event handlers", () => {
      const dirty = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Click me");
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("alert");
    });

    it("should remove iframe tags", () => {
      const dirty = '<iframe src="http://evil.com"></iframe>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("");
      expect(result).not.toContain("iframe");
    });

    it("should remove svg with event handlers", () => {
      const dirty = '<svg onload="alert(\'xss\')"></svg>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("");
      expect(result).not.toContain("svg");
      expect(result).not.toContain("onload");
    });

    it("should handle encoded XSS attempts", () => {
      const dirty = '"><script>alert(String.fromCharCode(88,83,83))</script>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
      // Should escape dangerous characters (exact format may vary)
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should remove javascript: protocol in links", () => {
      const dirty = '<a href="javascript:alert(\'xss\')">Click</a>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Click");
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("alert");
    });

    it("should handle data: protocol XSS", () => {
      const dirty = '<img src="data:text/html,<script>alert(\'xss\')</script>">';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("");
      expect(result).not.toContain("script");
    });

    it("should handle vbscript protocol", () => {
      const dirty = '<a href="vbscript:msgbox(\'xss\')">Click</a>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Click");
      expect(result).not.toContain("vbscript");
    });

    it("should remove event handlers with style attribute", () => {
      const dirty = '<p style="background:url(javascript:alert(\'xss\'))">Text</p>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Text");
      expect(result).not.toContain("javascript");
      expect(result).not.toContain("alert");
    });

    it("should handle mutation XSS with style tags", () => {
      const dirty = '<style><img title="</style><img src=x onerror="alert(\'xss\')"></style>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });
  });

  describe("HTML Entity Preservation", () => {
    it("should preserve HTML entities in text", () => {
      const dirty = "&lt;tag&gt;";
      const result = sanitizeHtml(dirty);
      expect(result).toBe("&lt;tag&gt;");
      expect(result).not.toContain("<tag>");
    });

    it("should preserve HTML entities for special characters", () => {
      const dirty = "Price: $50 &amp; free shipping &copy; 2024";
      const result = sanitizeHtml(dirty);
      expect(result).toContain("&amp;");
      expect(result).toContain("&copy;");
      expect(result).toContain("Price: $50");
    });

    it("should preserve numeric HTML entities", () => {
      const dirty = "&#169; &#x00A9;";
      const result = sanitizeHtml(dirty);
      expect(result).toContain("&#169;");
      expect(result).toContain("&#x00A9;");
    });

    it("should preserve named HTML entities for common symbols", () => {
      const dirty = "&nbsp; &mdash; &ldquo;Hello&rdquo;";
      const result = sanitizeHtml(dirty);
      expect(result).toContain("&nbsp;");
      expect(result).toContain("&mdash;");
    });
  });

  describe("Safe HTML Tag Removal", () => {
    it("should remove safe HTML tags and preserve text", () => {
      const dirty = "Hello <b>world</b>!";
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Hello world!");
      expect(result).not.toContain("<b>");
      expect(result).not.toContain("</b>");
    });

    it("should remove multiple nested tags", () => {
      const dirty = "<div><span><p>Content</p></span></div>";
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Content");
      expect(result).not.toContain("<div>");
      expect(result).not.toContain("<span>");
      expect(result).not.toContain("<p>");
    });

    it("should handle mixed safe and unsafe tags", () => {
      const dirty = "<b>Bold <script>alert('xss')</script> text</b>";
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Bold  text");
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      const result = sanitizeHtml("");
      expect(result).toBe("");
    });

    it("should handle null/undefined gracefully", () => {
      expect(sanitizeHtml(null as unknown as string)).toBe("");
      expect(sanitizeHtml(undefined as unknown as string)).toBe("");
    });

    it("should handle whitespace-only strings", () => {
      const result = sanitizeHtml("   ");
      expect(result).toBe("   ");
    });

    it("should handle very long strings", () => {
      const longText = "A".repeat(10000);
      const dirty = `<div>${longText}</div>`;
      const result = sanitizeHtml(dirty);
      expect(result).toBe(longText);
    });

    it("should handle deeply nested tags", () => {
      let dirty = "Content";
      for (let i = 0; i < 50; i++) {
        dirty = `<div>${dirty}</div>`;
      }
      const result = sanitizeHtml(dirty);
      expect(result).toBe("Content");
    });
  });

  describe("Admin Input Scenarios", () => {
    it("should sanitize admin quote input with XSS", () => {
      const adminInput = 'Quote: <script>alert("xss")</script> "Amazing service!"';
      const result = sanitizeHtml(adminInput);
      expect(result).toBe('Quote:  "Amazing service!"');
      expect(result).not.toContain("script");
    });

    it("should sanitize admin testimonial with embedded payload", () => {
      const testimonial = 'Great work! <img src=x onerror="fetch(\'http://evil.com\')">';
      const result = sanitizeHtml(testimonial);
      expect(result).toBe("Great work! ");
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("fetch");
    });

    it("should sanitize admin form input attempting breakout", () => {
      const adminForm = 'Normal text"><script>alert("xss")</script>';
      const result = sanitizeHtml(adminForm);
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });
  });
});

describe("sanitizeRichText - Safe HTML Formatting", () => {
  describe("Allowed Tags", () => {
    it("should allow bold tags", () => {
      const input = "This is <b>bold</b> text";
      const result = sanitizeRichText(input);
      expect(result).toContain("<b>");
      expect(result).toContain("</b>");
    });

    it("should allow italic tags", () => {
      const input = "This is <i>italic</i> text";
      const result = sanitizeRichText(input);
      expect(result).toContain("<i>");
      expect(result).toContain("</i>");
    });

    it("should allow strong tags", () => {
      const input = "<strong>Important</strong> information";
      const result = sanitizeRichText(input);
      expect(result).toContain("<strong>");
      expect(result).toContain("</strong>");
    });

    it("should allow em tags", () => {
      const input = "This is <em>emphasized</em> text";
      const result = sanitizeRichText(input);
      expect(result).toContain("<em>");
      expect(result).toContain("</em>");
    });

    it("should allow paragraph tags", () => {
      const input = "<p>First paragraph</p><p>Second paragraph</p>";
      const result = sanitizeRichText(input);
      expect(result).toContain("<p>");
      expect(result).toContain("</p>");
    });

    it("should allow line break tags", () => {
      const input = "Line 1<br>Line 2";
      const result = sanitizeRichText(input);
      expect(result).toContain("<br");
    });

    it("should allow list tags", () => {
      const input = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const result = sanitizeRichText(input);
      expect(result).toContain("<ul>");
      expect(result).toContain("<li>");
    });

    it("should allow ordered lists", () => {
      const input = "<ol><li>First</li><li>Second</li></ol>";
      const result = sanitizeRichText(input);
      expect(result).toContain("<ol>");
      expect(result).toContain("<li>");
    });

    it("should allow underline tags", () => {
      const input = "This is <u>underlined</u>";
      const result = sanitizeRichText(input);
      expect(result).toContain("<u>");
      expect(result).toContain("</u>");
    });

    it("should allow mixed safe tags", () => {
      const input =
        "<p>This is <b>bold</b> and <i>italic</i> and <u>underlined</u>.</p>";
      const result = sanitizeRichText(input);
      expect(result).toContain("<b>");
      expect(result).toContain("<i>");
      expect(result).toContain("<u>");
    });
  });

  describe("Disallowed Tags and Attributes", () => {
    it("should remove script tags even from rich text", () => {
      const input = "<p>Safe <script>alert('xss')</script> content</p>";
      const result = sanitizeRichText(input);
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("should remove event handler attributes", () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeRichText(input);
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("alert");
    });

    it("should remove style attributes", () => {
      const input = '<b style="color:red">Bold text</b>';
      const result = sanitizeRichText(input);
      expect(result).toContain("<b>");
      expect(result).not.toContain("style");
    });

    it("should remove class attributes", () => {
      const input = '<p class="malicious">Content</p>';
      const result = sanitizeRichText(input);
      expect(result).toContain("<p>");
      expect(result).not.toContain("class");
    });

    it("should remove id attributes", () => {
      const input = '<p id="xss-target">Content</p>';
      const result = sanitizeRichText(input);
      expect(result).toContain("<p>");
      expect(result).not.toContain("id");
    });

    it("should remove iframe tags", () => {
      const input =
        "<p>Content</p><iframe src='http://evil.com'></iframe>";
      const result = sanitizeRichText(input);
      expect(result).not.toContain("iframe");
    });

    it("should remove img tags", () => {
      const input = "<p>Text <img src='evil.jpg'> more text</p>";
      const result = sanitizeRichText(input);
      expect(result).not.toContain("img");
    });
  });

  describe("Rich Text Preservation", () => {
    it("should preserve text content with multiple formatting", () => {
      const input =
        "<p>Welcome to <b>Rocky Shore</b> <i>Detailing</i>!</p><ul><li>Quality service</li><li>Professional team</li></ul>";
      const result = sanitizeRichText(input);
      expect(result).toContain("Rocky Shore");
      expect(result).toContain("Detailing");
      expect(result).toContain("Quality service");
    });

    it("should preserve text entities in rich text", () => {
      const input = "<p>Price: $50 &amp; warranty &copy;</p>";
      const result = sanitizeRichText(input);
      expect(result).toContain("$50");
      expect(result).toContain("warranty");
      // Check that the result contains properly escaped or converted entities
      expect(result).toContain("&amp;");
      // © may be preserved as entity or as actual character
      expect(result.includes("&copy;") || result.includes("©")).toBe(true);
    });
  });
});
