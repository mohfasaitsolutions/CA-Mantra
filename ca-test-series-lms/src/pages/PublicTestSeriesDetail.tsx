import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import { useTestSeries } from "@/hooks/use-test-series";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/contexts/CartContext";
import { TEXT_COLORS } from "@/constants/colors";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";

const levelLabel = (lvl?: string) =>
  lvl === "FOUNDATION"
    ? "Foundation"
    : lvl === "INTERMEDIATE"
    ? "Intermediate"
    : lvl === "FINAL"
    ? "Final"
    : lvl || "";

const PublicTestSeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTestSeriesById } = useTestSeries();
  const { isAuthenticated, user } = useAuth();
  const { cart, addToCart, removeFromCart, isLoading: cartLoading } = useCart();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [thumbnail, setThumbnail] = useState<string>("");
  const [caLevel, setCaLevel] = useState<string>("");
  const [tests, setTests] = useState<
    Array<{ id: string; title: string; type: "Objective" | "Subjective" }>
  >([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await fetchTestSeriesById(id);
      if (!data) return;
      setTitle(data.title);
      setDescription(data.description || "");
      setPrice(data.price);
      setThumbnail(data.thumbnailUrl || "");
      setCaLevel(levelLabel(data.caLevel));
      setTests(
        (data.tests || []).map((t) => ({
          id: t.id,
          title: t.title,
          type: t.testType === "OBJECTIVE" ? "Objective" : "Subjective",
        }))
      );
    };
    load();
  }, [id, fetchTestSeriesById]);

  const isInCart = id ? cart.items.some((item) => String(item.testSeriesId || item.testSeries?._id) === id) : false;

  const handleBuy = () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/test-series/${id}`)}`);
      return;
    }
    // Redirect to payment checkout page
    navigate(`/payment/checkout?testSeriesId=${id}`);
  };

  const handleAddToCart = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/test-series/${id}`)}`);
      return;
    }
    const isStudentRole = user?.role === "STUDENTS" || user?.role === "STUDENT";
    if (!isStudentRole) {
      toast.error("Only students can add test series to cart.");
      return;
    }
    const added = await addToCart(id);
    if (added) {
      toast.success("Added to cart");
    }
  };

  const handleRemoveFromCart = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/test-series/${id}`)}`);
      return;
    }
    const removed = await removeFromCart(id);
    if (removed) {
      toast.success("Removed from cart");
    }
  };

  if (!title && !description && !price) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Test Series Not Found</h2>
        <Link to="/test-series">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link to="/test-series">
              <Button variant="ghost">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-gray-800 md:hidden truncate px-2">
              {title}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="p-6">
                {caLevel && (
                  <Badge variant="secondary" className="w-fit">
                    {caLevel}
                  </Badge>
                )}
                <CardTitle className="text-3xl font-bold mt-2">
                  {title}
                </CardTitle>
                <p className="text-muted-foreground mt-2 text-base">
                  {description}
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>
                      <span className="font-bold text-foreground">—</span>{" "}
                      students
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>— validity</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Tests Included ({tests.length})
                </h3>
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center p-3 rounded-md border bg-gray-50"
                    >
                      <CheckCircle className={`h-5 w-5 mr-3 ${TEXT_COLORS.SUCCESS} flex-shrink-0`} />
                      <div className="flex-1">
                        <p className="font-medium">{test.title}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {test.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-56 object-cover rounded-t-lg"
              />
              <CardContent className="p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-ca-primary">
                    ₹{price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Get lifetime access to all {tests.length} tests.
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  {isInCart ? (
                    <Button
                      variant="destructive"
                      onClick={handleRemoveFromCart}
                      disabled={cartLoading}
                      className="w-full text-lg py-6"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Remove from Cart
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      className="w-full border-ca-primary text-ca-primary hover:bg-ca-primary hover:text-white text-lg py-6"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                  <Button
                    onClick={handleBuy}
                    className="w-full bg-ca-primary hover:bg-ca-primary/90 text-lg py-6"
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicTestSeriesDetail;
